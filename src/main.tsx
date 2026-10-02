import React from 'react';
import {createRoot} from 'react-dom/client';
import Portfolio from './Portfolio';
import Admin from './Admin';
import './styles.css';
const admin=location.pathname==='/admin'||location.pathname==='/admin/';
if(admin){document.title='Boshqaruv — Shamsiddin';const robots=document.createElement('meta');robots.name='robots';robots.content='noindex,nofollow';document.head.append(robots)}
createRoot(document.getElementById('root')!).render(<React.StrictMode>{admin?<Admin/>:<Portfolio/>}</React.StrictMode>);
