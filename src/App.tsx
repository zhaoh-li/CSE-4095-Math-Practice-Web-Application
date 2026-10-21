import { createBrowserRouter, RouterProvider } from 'react-router';
import { createAppRoutes } from './routes';

const router = createBrowserRouter(createAppRoutes());

function App() {
  return <RouterProvider router={router} />;
}

export default App;
