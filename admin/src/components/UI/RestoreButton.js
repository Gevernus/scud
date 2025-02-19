import { Button, useNotify, useRefresh, useRecordContext } from 'react-admin';
import { useUser } from '../../context/UserContext';

const RestoreButton = ({ resource }) => {
    const { user } = useUser();
    // Get the record via useRecordContext
    const record = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();

    if (!record) return null;

    const handleRestore = async () => {
        // We generate the URL based on the resource and record.id
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/admin'
        const url = `${apiUrl}/trash/${resource}/${record.id}/restore`;
        try {
            // Формируем заголовки запроса, добавляя telegramId из контекста
            const headers = {
                'Content-Type': 'application/json',
            };

            if (user?.telegramId) {
                headers['X-Telegram-ID'] = user.telegramId;
            }
            const response = await fetch(url, {
                method: 'POST',
                headers,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка восстановления');
            }
            await response.json();
            notify('Объект успешно восстановлен', { type: 'info' });
            refresh(); //Updating the list so that the recovered record is extracted from the trash
        } catch (error) {
            notify(`Ошибка восстановления: ${error.message}`, { type: 'warning' });
        }
    };

    return (
        <Button label="Восстановить" onClick={handleRestore} />
    );
};

export default RestoreButton;
