
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';

// Auth logic is handled in Layout.tsx via useAuthStore check

// We need a wrapper component to provide the router context for AuthGuard
// But RouterProvider provides the context. 
// A common pattern is to put the guard inside the routes or wrap the router creation.
// However, since we defined routes separately, we can't easily wrap individual routes without changing structure heavily.
// ALTERNATIVE: Handle auth check in Layout or Root component.

// We will modify Layout.tsx instead to handle redirection? 
// Or better, we can't use useNavigate outside of RouterProvider.
// So we need to move RouterProvider *up* or create a wrapper inside.

// Let's modify App to just return RouterProvider, and handle protection inside Layout.wrapper
// But wait, the requirements say "Auto-navigate to Dashboard" after login.
// And "Login & Onboarding Flow" before accessing Dashboard.

// Let's do this: 
// We will create a Root component that handles the redirection logic that handles the "/" path?
// Or we can just check in the Layout.

// Actually, let's keep App.tsx simple and trust the Layout or specific route loaders. 
// But since we are using 'react-router', we can use `loader` or `useEffect` in the main Layout.

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
