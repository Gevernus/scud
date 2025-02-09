import React from 'react';
import { useRecordContext } from 'react-admin';
import { PERMISSIONS_MODULES, checkPermission } from '../../permissions';

const PermissionsField = ({ source }) => {
  const record = useRecordContext();
  if (!record) return null;

  const permissions = record[source] || 0;
  const modulePermissions = {};

  Object.entries(PERMISSIONS_MODULES).forEach(([module, actions]) => {
    const actionsList = Object.entries(actions)
      .filter(([_, flag]) => checkPermission(permissions, flag))
      .map(([action]) => action);

    if (actionsList.length > 0) {
      modulePermissions[module] = actionsList;
    }
  });

  if (Object.keys(modulePermissions).length === 0) {
    return <span>Нет прав</span>;
  }

  return (
    <div>
      {Object.entries(modulePermissions).map(([module, actions]) => (
        <div key={module}>
          <strong>{module}</strong>
          {actions.map((action) => (
            <span key={action}> - {action}</span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PermissionsField;
