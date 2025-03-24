import React, { useState } from 'react';
import { useRecordContext } from 'react-admin';
import { Popover, Box, Button, List, ListItem } from '@mui/material';

const DeviceIdField = ({ source }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const record = useRecordContext();
  if (!record || !record[source] || !Array.isArray(record[source])) return <span>Нет устройств</span>;

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
        disableEnforceFocus
        disableAutoFocus
        sx={{ pointerEvents: 'none' }} // Removes the hiding delay
      >
        <Box sx={{ p: 2, maxWidth: 450 }}>
          <List>
            {record[source].map((device, index) => (
              <ListItem key={index} sx={{ wordBreak: 'break-all' }}>
                {device}
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </div>
  );
};

export default DeviceIdField;
