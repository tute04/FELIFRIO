import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Felifrío · Gestión',description:'El día a día de tu fábrica de hielo, en un solo lugar.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
