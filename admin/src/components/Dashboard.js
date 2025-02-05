import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { Title } from 'react-admin';

export const Dashboard = () => (
    <Card>
        <Title title="Welcome to the Admin Panel" />
        <CardHeader title="Dashboard" />
        <CardContent>
            {/* <p>Welcome to your admin panel.</p> */}
            <Typography variant="h4">Добро пожаловать в админ-панель!</Typography>
            <Typography variant="body1">Выберите раздел в меню слева.</Typography>
        </CardContent>
    </Card>
);