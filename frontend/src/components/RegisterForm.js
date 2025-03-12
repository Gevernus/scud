import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import WebApp from '@twa-dev/sdk';

const RegisterForm = ({ apiUrl, onSuccess }) => {
    const { registrationAllowed, verification, tempUser, deviceId } = useUser();
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [wrongAttempts, setWrongAttempts] = useState(0); //  Tracking invalid attempts
    const [isBlocked, setIsBlocked] = useState(false); // Blocking
    const [isPasswordCorrect, setIsPasswordCorrect] = useState(false); // Показывать форму, если пароль правильный

    // Field fields
    const [formData, setFormData] = useState({
        firstName: tempUser?.first_name || "",
        lastName: tempUser?.last_name || "",
        middleName: "",
        phone: "",
        email: "",
        division: "",
        position: "",
        company: "",
    });

    const handleSupportLeadtehClick = () => {
        WebApp.openLink("https://app.leadteh.ru/w/djk3S", {
            try_instant_view: false,
            try_browser: 'default'
        });
    };

    // Список компаний
    const [companies, setCompanies] = useState([]);
    // Загружаем компании с сервера
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await fetch(`${apiUrl}/front/companies`);
                const data = await response.json();
                setCompanies(data); // Устанавливаем компании в стейт
            } catch (error) {
                console.error("Ошибка загрузки компаний:", error);
            }
        };
        fetchCompanies();
    }, [apiUrl]);


    if (!registrationAllowed) {
        return <div className="text-white">Регистрация недоступна</div>;
    }

    if (!tempUser) {
        return <div className="text-white">Ошибка: данные Telegram не найдены.</div>;
    }

    

    const handlePasswordCheck = async () => {
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
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Неверный пароль");
            }

            if(verification) {
                verificationUser(tempUser);
            }

            setIsPasswordCorrect(true); // If the password is correct, show the form
            setError(null);
            
        } catch (error) {
            setError(error.message);
            setWrongAttempts((prev) => prev + 1); 

            if (wrongAttempts + 1 >= 3) { 
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
    // User verification
    const verificationUser = async (user) => {
        try {
            const response = await fetch(`${apiUrl}/front/users/verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: user.id,
                    deviceId: deviceId,
                }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || "Ошибка верификации.");
            }

            onSuccess();
    
        } catch (error) {
            console.error("❌ Ошибка верификации:", error);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {
        if (!formData.company) {
            setError("Выберите компанию!");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/front/users/new`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: tempUser.id,
                    username: tempUser.username,
                    deviceId: deviceId,
                    ...formData, // We transmit all the entered fields
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Ошибка регистрации");
            }

            onSuccess(); //Reboot the application

        } catch (error) {
            setError(error.message);
        }
    };

    if (verification) {
        return <>
        <div className="flex flex-col items-center justify-center min-h-screen  gap-4 bg-gray-900 text-white p-4">
        
            <h2 className="text-xl text-center font-semibold">Введите PIN для верификации и добавления нового устройства.</h2>           
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBlocked} // Input blocking after 3 errors
                className="mt-4 p-2 border border-gray-600 rounded-md text-black"
            />
            <h4 className="text-base text-center font-semibold">Если вы не знаете PIN-код, обратитесь к администратору</h4>
            
            {error && password === "" && !isPasswordCorrect && <p className="text-red-500 text-center mt-2">{error}</p>}
            {isBlocked && <p className="text-red-500 text-center mt-2">Превышенно количество попыток ввода! Ваш аккаунт заблокирован обратитесь к администратору.</p>}
            <button
                onClick={handlePasswordCheck}
                disabled={isBlocked} 
                className={`mt-4 px-4 py-2 rounded-md ${isBlocked ? "bg-gray-600" :(isPasswordCorrect ? "bg-green-500" : "bg-blue-500")}`}
            >
                {isBlocked ? "Заблокировано" :(isPasswordCorrect ? "PIN верный" : "Проверить PIN")}
            </button>
            <button
                    onClick={handleSupportLeadtehClick}
                    className=" mt-4 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                    Техподдержка
            </button>
        </div>
        </>
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen  gap-4 bg-gray-900 text-white p-4">
            {!isPasswordCorrect &&<>
            <h2 className="text-xl font-semibold">Введите пароль для регистрации</h2>           
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isBlocked} // Input blocking after 5 errors
                className="mt-4 p-2 border border-gray-600 rounded-md text-black"
            />
            <h4 className="text-base text-center font-semibold">Если вы не знаете PIN-код, обратитесь к администратору</h4>
            </>}
            {error && password === "" && !isPasswordCorrect && <p className="text-red-500 text-center mt-2">{error}</p>}
            {isBlocked && <p className="text-red-500 text-center mt-2">Превышенно количество попыток ввода! Ваш аккаунт заблокирован обратитесь к администратору.</p>}
            <button
                onClick={handlePasswordCheck}
                disabled={isBlocked} 
                className={`mt-4 px-4 py-2 rounded-md ${isBlocked ? "bg-gray-600" :(isPasswordCorrect ? "bg-green-500" : "bg-blue-500")}`}
            >
                {isBlocked ? "Заблокировано" :(isPasswordCorrect ? "Пароль верный" : "Зарегистрироваться")}
            </button>
            {!isPasswordCorrect && <button
                    onClick={handleSupportLeadtehClick}
                    className=" mt-4 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                    Техподдержка
            </button>}

            {isPasswordCorrect && <>
                <h2 className="text-xl font-semibold">Введите пожалуйста ваши данные.</h2>
                <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Имя"
                    className="mt-2 p-2 w-full sm:w-96 border border-gray-600 rounded-md text-black"
                />
                <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Фамилия"
                    className="mt-2 p-2 w-full sm:w-96 border border-gray-600 rounded-md text-black"
                />
                <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Отчество"
                    className="mt-2 p-2 w-full sm:w-96 border border-gray-600 rounded-md text-black"
                />
                <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Телефон"
                    className="mt-2 p-2 w-full sm:w-96 border border-gray-600 rounded-md text-black"
                />
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="E-mail"
                    className="mt-2 p-2 w-full sm:w-96 border border-gray-600 rounded-md text-black"
                />
                <input
                    type="text"
                    name="division"
                    value={formData.division}
                    onChange={handleInputChange}
                    placeholder="Подразделение"
                    className="mt-2 p-2 w-full sm:w-96 border border-gray-600 rounded-md text-black"
                />
                <select
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={`mt-2 p-2 w-full sm:w-96 border rounded-md text-black 
                        ${error ? 'border-red-500 border-2' : 'border-gray-600'}`}
                >
                    <option value="">Выберите компанию</option>
                    {companies.map((company) => (
                        <option key={company._id} value={company._id}>
                            {company.fullName}
                        </option>
                    ))}
                </select>
                
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

                <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="Должность"
                    className="mt-2 p-2 w-full sm:w-96 border border-gray-600 rounded-md text-black"
                />
                <button
                    onClick={handleRegister}
                    className="mt-4 px-4 py-2 bg-blue-500 rounded-md"
                >
                    Зарегистрироваться
                </button>
            </>}
        </div>
    );
};

export default RegisterForm;
