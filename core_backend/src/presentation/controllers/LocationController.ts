import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Database } from '../../infrastructure/database/Database';

const LocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional()
});

export class LocationController {

    // Sync the user's latest mobile geolocation to the PostgreSQL history tracker
    public static async syncLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsedBody = LocationSchema.parse(req.body);
            const userId = 'aa5f877d-7718-47f2-8c11-1402db39df91'; // Mock phase 3 auth user

            const query = `
                INSERT INTO user_locations (user_id, latitude, longitude, address)
                VALUES ($1, $2, $3, $4)
                RETURNING id;
            `;

            await Database.query(query, [
                userId,
                parsedBody.latitude,
                parsedBody.longitude,
                parsedBody.address || null
            ]);

            res.status(201).json({
                success: true,
                message: 'Location synchronized securely'
            });

        } catch (error: any) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ success: false, message: 'Invalid payload', data: (error as any).errors });
            } else {
                console.error('Error syncing location: ', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        }
    }
}
