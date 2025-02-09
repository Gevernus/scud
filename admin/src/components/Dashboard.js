import { Card, CardContent, CardHeader, Typography } from '@mui/material';
import { Title } from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';

export const Dashboard = () => {
  const { user, checkPermission } = useUser();

  const permissions = user.permissions || 0;
  const modulePermissions = {};

  Object.entries(PERMISSIONS_MODULES).forEach(([module, actions]) => {
    const actionsList = Object.entries(actions)
      .filter(([_, flag]) => checkPermission(permissions, flag))
      .map(([action]) => action);

    if (actionsList.length > 0) {
      modulePermissions[module] = actionsList;
    }
  });

  return (
    <Card>
      <Title title="Welcome to the Admin Panel" />
      <CardHeader title="Dashboard" />
      <CardContent>
        <Typography variant="h4">
          Добро пожаловать {user.firstName} {user.lastName}!
        </Typography>
        <Typography variant="body1">
          Ваш логин: {user.username}
        </Typography>
        <Typography variant="body1" component="div">
          <strong>Ваши разрешения:</strong>
          {Object.keys(modulePermissions).length > 0 ? (
            <ul>
              {Object.entries(modulePermissions).map(([module, actions]) => (
                <li key={module}>
                  <strong>{module}:</strong> {actions.join(', ')}
                </li>
              ))}
            </ul>
          ) : (
            <span> Нет прав</span>
          )}
        </Typography>
      </CardContent>
    </Card>
  );
};
