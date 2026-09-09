import '@/assets/style/styles.css';
import Index from '@/pages/index';

import { Route,Routes } from 'react-router';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<Index />}/>
            <Route path="*" element={<Index />}/>
        </Routes>
    );
};

export default App;
