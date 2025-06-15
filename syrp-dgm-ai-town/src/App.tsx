import React from 'react';
import { ConvexClientProvider } from './components/ConvexClientProvider';
import { Game } from './components/Game';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <ConvexClientProvider>
      <div className="min-h-screen game-background">
        <Game />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastClassName="font-body"
        />
      </div>
    </ConvexClientProvider>
  );
}

export default App;