import { useState } from 'react';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Tooltip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { FaTrashCan, FaUsers, FaUserPlus } from 'react-icons/fa6';
import { MdOutlineEventNote, MdExpandLess, MdExpandMore } from 'react-icons/md';
import { FaServer, FaHome } from 'react-icons/fa';
import { GiTeamIdea } from 'react-icons/gi';

const CustomMenu = ({ open }) => {
  const [openTrash, setOpenTrash] = useState(false); // Basket opening control

  return (
    <List component="nav">
      <Tooltip title="Главная" placement="right" disableHoverListener={open}>
        <ListItemButton component={Link} to="/">
          <ListItemIcon>
            <FaHome />
          </ListItemIcon>
          {open && <ListItemText primary="Главная" />}
        </ListItemButton>
      </Tooltip>

      <Tooltip title="Пользователи" placement="right" disableHoverListener={open}>
        <ListItemButton component={Link} to="/users">
          <ListItemIcon>
            <FaUsers />
          </ListItemIcon>
          <ListItemText primary="Пользователи" />
        </ListItemButton>
      </Tooltip>

      <Tooltip title="Журнал событий" placement="right" disableHoverListener={open}>
        <ListItemButton component={Link} to="/events">
          <ListItemIcon>
            <MdOutlineEventNote />
          </ListItemIcon>
          <ListItemText primary="Журнал событий" />
        </ListItemButton>
      </Tooltip>

      <Tooltip title="Станции" placement="right" disableHoverListener={open}>
        <ListItemButton component={Link} to="/stations">
          <ListItemIcon>
            <FaServer />
          </ListItemIcon>
          <ListItemText primary="Станции" />
        </ListItemButton>
      </Tooltip>

      <Tooltip title="Контрагенты" placement="right" disableHoverListener={open}>
        <ListItemButton component={Link} to="/counterparts">
          <ListItemIcon>
            <GiTeamIdea />
          </ListItemIcon>
          <ListItemText primary="Контрагенты" />
        </ListItemButton>
      </Tooltip>

      <Tooltip title="Регистрация" placement="right" disableHoverListener={open}>
        <ListItemButton component={Link} to="/registration">
          <ListItemIcon>
            <FaUserPlus />
          </ListItemIcon>
          <ListItemText primary="Регистрация" />
        </ListItemButton>
      </Tooltip>

      {/* Trash - Nested menu */}
      <Tooltip title="Корзина" placement="right" disableHoverListener={open}>
        <ListItemButton onClick={() => setOpenTrash(!openTrash)}>
          <ListItemIcon>
            <FaTrashCan />
          </ListItemIcon>
          <ListItemText primary="Корзина" />
          {openTrash ? <MdExpandLess /> : <MdExpandMore />}
        </ListItemButton>
      </Tooltip>

      <Collapse in={openTrash} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <Tooltip
            title="Корзина пользователей"
            placement="right"
            disableHoverListener={open}
          >
            <ListItemButton component={Link} to="/usersTrash" sx={{ pl: 4 }}>
              <ListItemIcon>
                <FaTrashCan />
              </ListItemIcon>
              <Box>
                <ListItemText primary="Корзина пользователей" />
              </Box>
            </ListItemButton>
          </Tooltip>

          <Tooltip
            title="Корзина событий"
            placement="right"
            disableHoverListener={open}
          >
            <ListItemButton component={Link} to="/eventsTrash" sx={{ pl: 4 }}>
              <ListItemIcon>
                <FaTrashCan />
              </ListItemIcon>
              <Box>
                <ListItemText primary="Корзина событий" />
              </Box>
            </ListItemButton>
          </Tooltip>

          <Tooltip
            title="Корзина Станций"
            placement="right"
            disableHoverListener={open}
          >
            <ListItemButton component={Link} to="/stationsTrash" sx={{ pl: 4 }}>
              <ListItemIcon>
                <FaTrashCan />
              </ListItemIcon>
              <Box>
                <ListItemText primary="Корзина Stations" />
              </Box>
            </ListItemButton>
          </Tooltip>

          <Tooltip
            title="Корзина Контрагенты"
            placement="right"
            disableHoverListener={open}
          >
            <ListItemButton
              component={Link}
              to="/counterpartyTrash"
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <FaTrashCan />
              </ListItemIcon>
              <Box>
                <ListItemText primary="Корзина Контрагенты" />
              </Box>
            </ListItemButton>
          </Tooltip>
        </List>
      </Collapse>
    </List>
  );
};

export default CustomMenu;
