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
            setError("Слишком много попыток вы заблокированы.");
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

            if (wrongAttempts + 1 >= 3) {
                // logFailedAttempts(tempUser); 
                lockUsers(tempUser); 
                setIsBlocked(true); 
                setWrongAttempts(0);
                setError(null);
            }
        }
        finally {
            setPassword("");
        }
    };

    // User blocking
    const lockUsers = async (user) => {
        try {
            const response = await fetch(`${apiUrl}/front/users/lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username,
                }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || "Ошибка логирования попытки.");
            }
    
            console.log("✅ Логирование неудачной попытки отправлено на сервер.");
        } catch (error) {
            console.error("❌ Ошибка логирования неудачной попытки:", error);
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
            <h2 className="text-xl font-semibold">Введите пароль для регистрации</h2>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBlocked} // Input blocking after 5 errors
                className="mt-4 p-2 border border-gray-600 rounded-md text-black"
            />
            {error && password === "" && <p className="text-red-500 mt-2">{error}</p>}
            {isBlocked && <p className="text-red-500 mt-2">Превышенно количество попыток ввода!</p>}
            <button
                onClick={handleRegister}
                disabled={isBlocked} 
                className={`mt-4 px-4 py-2 rounded-md ${isBlocked ? "bg-gray-600" : "bg-blue-500"}`}
            >
                {isBlocked ? "Заблокировано" : "Зарегистрироваться"}
            </button>
        </div>
    );
};

export default RegisterForm;
