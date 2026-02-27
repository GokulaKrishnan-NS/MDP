import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Database } from '../../infrastructure/database/Database';

// Schema for request validation
const EmergencyContactSchema = z.object({
    emergencyContact: z.object({
        name: z.string().min(1, "Name is required"),
        phone: z.string().min(1, "Phone number is required"),
        email: z.string().email("Invalid email format").optional().or(z.literal('')),
    })
});

export class UserController {
    public static async updateEmergencyContact(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsedBody = EmergencyContactSchema.parse(req.body);

            // Hardcoded user ID for phase 3 standalone testing
            const userId = 'aa5f877d-7718-47f2-8c11-1402db39df91';

            const query = `
                UPDATE users 
                SET emergency_name = $1, emergency_phone = $2, emergency_email = $3, updated_at = NOW()
                WHERE id = $4
                RETURNING id, emergency_name, emergency_phone, emergency_email
            `;
            const values = [
                parsedBody.emergencyContact.name,
                parsedBody.emergencyContact.phone,
                parsedBody.emergencyContact.email || null,
                userId
            ];

            const result = await Database.query(query, values);

            if (result.rows.length === 0) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Emergency contact updated successfully',
                data: result.rows[0]
            });

        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation Error',
                    data: (error as any).errors
                });
            } else {
                console.error('Unhandled Server Error updating emergency contact: ', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        }
    }
}
