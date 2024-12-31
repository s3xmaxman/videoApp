import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "./App.css";
import ControlLayout from "./layouts/ControlLayout";

const client = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={client}>
      <ControlLayout>
        <Toaster />
      </ControlLayout>
    </QueryClientProvider>
  );
}

export default App;
