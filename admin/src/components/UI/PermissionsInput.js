import React from 'react';
import { useInput } from 'react-admin';
import { Checkbox, FormGroup, FormControlLabel } from '@mui/material';
import {
  PERMISSIONS_MODULES,
  modifyPermission,
  checkPermission,
} from '../../permissions';

const PermissionsInput = ({ source, record = {} }) => {
  const {
    field: { value = 0, onChange },
  } = useInput({ source });

  const handlePermissionToggle = (permissionFlag) => {
    onChange(modifyPermission(value, permissionFlag));
  };

  return (
    <FormGroup>
      {Object.entries(PERMISSIONS_MODULES).map(([module, actions]) => (
        <div
          key={module}
          style={{
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '150px', textWrap: 'wrap' }}>{module}</div>
          {Object.entries(actions).map(([action, flag]) => (
            <FormControlLabel
              key={action}
              control={
                <Checkbox
                  checked={checkPermission(value, flag)}
                  onChange={() => handlePermissionToggle(flag)}
                />
              }
              label={action}
            />
          ))}
        </div>
      ))}
    </FormGroup>
  );
};

export default PermissionsInput;
