import { useState } from 'react';
import { useUser } from '../context/UserContext';

const RegisterForm = ({ apiUrl, onSuccess }) => {
    const { registrationAllowed, tempUser, deviceId } = useUser();
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [wrongAttempts, setWrongAttempts] = useState(0); //  Tracking invalid attempts
    const [isBlocked, setIsBlocked] = useState(false); // Blocking
    if (!registrationAllowed) {
        return <div className="text-white">Регистрация недоступна</div>;
    }

    if (!tempUser) {
        return <div className="text-white">Ошибка: данные Telegram не найдены.</div>;
    }

    const handleRegister = async () => {
        if (isBlocked) {
            setError("Слишком много попыток. Подождите 30 секунд.");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/front/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: tempUser.id,
                    firstName: tempUser.first_name,
                    lastName: tempUser.last_name,
                    username: tempUser.username,
                    password,
                    deviceId: deviceId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Ошибка регистрации");
            }

            onSuccess(); 

        } catch (error) {
            setError(error.message);
            setWrongAttempts((prev) => prev + 1); 
            if (wrongAttempts + 1 == 3) {
                logHackAttempts(tempUser);
            }

            if (wrongAttempts + 1 >= 5) {
                logFailedAttempts(tempUser); 
                setIsBlocked(true); 

                setTimeout(() => {
                    setIsBlocked(false);
                    setWrongAttempts(0);
                    setError(null);
                }, 30000);
            }
        }
    };

    // Invalid attempt logging function
    const logFailedAttempts = async (user) => {
        try {
            await fetch(`${apiUrl}/front/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: "incident",
                    description: `Пользователь ${user.first_name} (${user.username}) с телеграмм ID ${user.id} был заблокирован.`,
                }),
            });
            console.log("✅ Логирование успешно отправлено.");
        } catch (error) {
            console.error("❌ Ошибка логирования:", error);
        }
    };
    const logHackAttempts = async (user) => {
        try {
            await fetch(`${apiUrl}/front/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: "incident",
                    description: `Пользователь ${user.first_name} (${user.username}) с телеграмм ID ${user.id} пытался взломать.`,
                }),
            });
            console.log("✅ Логирование успешно отправлено.");
        } catch (error) {
            console.error("❌ Ошибка логирования:", error);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
            <h2 className="text-xl font-semibold">Введите пароль для регистрации</h2>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBlocked} // ✅ Блокировка ввода после 5 ошибок
                className="mt-4 p-2 border border-gray-600 rounded-md text-black"
            />
            {error && <p className="text-red-500 mt-2">{error}</p>}
            <button
                onClick={handleRegister}
                disabled={isBlocked} // ✅ Блокировка кнопки
                className={`mt-4 px-4 py-2 rounded-md ${isBlocked ? "bg-gray-600" : "bg-blue-500"}`}
            >
                {isBlocked ? "Заблокировано (30 сек.)" : "Зарегистрироваться"}
            </button>
        </div>
    );
};

export default RegisterForm;
