import { createRoot } from 'react-dom/client'
import './index.css'
import AIChatApp from "./App.tsx";

createRoot(document.getElementById('root')!).render(
    <div className='min-w-[100vw]'><AIChatApp /></div>
)
