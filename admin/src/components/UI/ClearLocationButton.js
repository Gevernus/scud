import { Button, useNotify, useRefresh, useRecordContext } from 'react-admin';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUser } from '../../context/UserContext';

const ClearLocationButton = () => {
    const { user } = useUser();
    const record = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();

    if (!record || !record.location) return null; // If location is empty, we don't show the button.

    const handleClearLocation = async () => {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/admin';
        const url = `${apiUrl}/nfc/${record.id}`;

        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            if (user?.telegramId) {
                headers['X-Telegram-ID'] = user.telegramId;
            }

            const response = await fetch(url, {
                method: 'PATCH', 
                headers,
                body: JSON.stringify({ location: '' }), // Clearing the location field
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка очистки локации');
            }

            notify('Локация успешно очищена', { type: 'info' });
            refresh(); 

        } catch (error) {
            notify(`Ошибка очистки: ${error.message}`, { type: 'warning' });
        }
    };

    return (
        <Button
            label="Очистить локацию"
            onClick={handleClearLocation}
            startIcon={<DeleteIcon />}
            size="small"
            color="secondary"
        />
    );
};

export default ClearLocationButton;
