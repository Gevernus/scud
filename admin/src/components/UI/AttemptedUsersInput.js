import React, { useEffect, useState, useMemo } from 'react';
import { useRecordContext, useDataProvider, AutocompleteArrayInput } from 'react-admin';

const AttemptedUsersInput = (props) => {
    const record = useRecordContext() || {};
    const dataProvider = useDataProvider();
    const [attemptedUsers, setAttemptedUsers] = useState([]);
    const [allowedUsers, setAllowedUsers] = useState([]);
    const [companiesMap, setCompaniesMap] = useState({});

    useEffect(() => {
        if (record.attemptedUsers && record.attemptedUsers.length > 0) {
            dataProvider.getMany('users', { ids: record.attemptedUsers })
                .then(({ data }) => {
                    setAttemptedUsers(data);
                    // console.log('attemptedUsers loaded:', data);
                })
                .catch(error => console.error('Ошибка загрузки attemptedUsers:', error));
        } else {
            setAttemptedUsers([]);
        }
    }, [record.attemptedUsers, dataProvider]);

    useEffect(() => {
        if (record.users && record.users.length > 0) {
            if (typeof record.users[0] === 'object' && record.users[0] !== null) {
                setAllowedUsers(record.users);
                // console.log('allowedUsers from record:', record.users);
            } else {
                dataProvider.getMany('users', { ids: record.users })
                    .then(({ data }) => {
                        setAllowedUsers(data);
                        // console.log('allowedUsers loaded:', data);
                    })
                    .catch(error => console.error('Ошибка загрузки allowedUsers:', error));
            }
        } else {
            setAllowedUsers([]);
        }
    }, [record.users, dataProvider]);

    // Меморизуем unionChoices, чтобы оно не пересчитывалось при каждом рендере
    const unionChoices = useMemo(() => {
        return [
            ...attemptedUsers,
            ...allowedUsers.filter(u => !attemptedUsers.some(a => a.id === u.id))
        ];
    }, [attemptedUsers, allowedUsers]);

    useEffect(() => {
        const companyIds = unionChoices.reduce((acc, user) => {
            if (user.company && Array.isArray(user.company)) {
                user.company.forEach(id => {
                    if (!acc.includes(id)) acc.push(id);
                });
            }
            return acc;
        }, []);
        if (companyIds.length > 0) {
            dataProvider.getMany('counterparts', { ids: companyIds })
                .then(({ data }) => {
                    const map = {};
                    data.forEach(comp => {
                        map[comp.id] = comp.fullName;
                    });
                    setCompaniesMap(map);
                    // console.log('Companies loaded:', map);
                })
                .catch(error => console.error('Ошибка загрузки компаний:', error));
        }
    }, [unionChoices, dataProvider]);

    if (!record || unionChoices.length === 0) {
        return <div>Нет пользователей для выбора</div>;
    }

    return (
        <AutocompleteArrayInput
            {...props}
            choices={unionChoices}
            optionText={choice => {
                if (!choice) return '';
                let companyText = '';
                if (choice.company && Array.isArray(choice.company) && choice.company.length > 0) {
                    const names = choice.company.map(compId => companiesMap[compId] || compId);
                    companyText = names.join(', ');
                }
                return `${choice.username} - ${choice.lastName || ''} ${choice.firstName || ''}${companyText ? ' (' + companyText + ')' : ''}`;
            }}
        />
    );
};

export default AttemptedUsersInput;
