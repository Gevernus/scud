import React, { useState } from 'react';
import { useRecordContext } from 'react-admin';
import { PERMISSIONS_MODULES, checkPermission } from '../../permissions';
import { Popover, Box, Button } from '@mui/material';

const PermissionsField = ({ source }) => {
  const [anchorEl, setAnchorEl] = useState(null);

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

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  return (
    <div>
      <Button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        size="small"
      >
        Подробнее
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleMouseLeave}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        disableEnforceFocus // Disaches a forced focus
        disableAutoFocus // Disaches the autofocus
        sx={{ pointerEvents: 'none' }} // Removes a delay in hiding
      >
        <Box sx={{ p: 2, maxWidth: 450 }}>
          {Object.entries(modulePermissions).map(([module, actions]) => (
            <div key={module}>
              <strong>{module}:</strong> {actions.join(', ')}
            </div>
          ))}
        </Box>
      </Popover>
    </div>
  );
};

export default PermissionsField;
