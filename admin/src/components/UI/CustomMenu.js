import { useState } from 'react';
import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Box,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { FaTrashCan, FaUsers } from 'react-icons/fa6';
import { MdOutlineEventNote, MdExpandLess, MdExpandMore } from 'react-icons/md';
import { FaServer, FaHome } from 'react-icons/fa';
import { GiTeamIdea } from 'react-icons/gi'; 

const CustomMenu = ({ open }) => {
    const [openTrash, setOpenTrash] = useState(false); // Basket opening control
    
    return (
        <List component="nav">
            <ListItemButton component={Link} to="/">
                <ListItemIcon><FaHome /></ListItemIcon>
                {open && <ListItemText primary="Главная" />}
            </ListItemButton>
            
            <ListItemButton component={Link} to="/users">
                <ListItemIcon>
                    <FaUsers />
                </ListItemIcon>
                <ListItemText primary="Пользователи" />
            </ListItemButton>

            <ListItemButton component={Link} to="/events">
                <ListItemIcon>
                    <MdOutlineEventNote />
                </ListItemIcon>
                <ListItemText primary="Журнал событий" />
            </ListItemButton>

            <ListItemButton component={Link} to="/stations">
                <ListItemIcon>
                    <FaServer />
                </ListItemIcon>
                <ListItemText primary="Станции" />
            </ListItemButton>

            <ListItemButton component={Link} to="/counterparts">
                <ListItemIcon>
                    <GiTeamIdea />
                </ListItemIcon>
                <ListItemText primary="Контрагенты" />
            </ListItemButton>

            {/* Trash - Nested menu */}
            <ListItemButton onClick={() => setOpenTrash(!openTrash)}>
                <ListItemIcon>
                    <FaTrashCan />
                </ListItemIcon>
                <ListItemText primary="Корзина" />
                {openTrash ? <MdExpandLess /> : <MdExpandMore />}
            </ListItemButton>

            <Collapse in={openTrash} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/usersTrash"
                        sx={{ pl: 4 }}
                    >
                        <ListItemIcon>
                            <FaTrashCan />
                        </ListItemIcon>
                        <Box >
                            <ListItemText primary="Корзина пользователей" />
                        </Box>
                    </ListItemButton>

                    <ListItemButton
                        component={Link}
                        to="/eventsTrash"
                        sx={{ pl: 4 }}
                    >
                        <ListItemIcon>
                            <FaTrashCan />
                        </ListItemIcon>
                        <Box>
                            <ListItemText primary="Корзина событий" />
                        </Box>
                    </ListItemButton>

                    <ListItemButton
                        component={Link}
                        to="/stationsTrash"
                        sx={{ pl: 4 }}
                    >
                        <ListItemIcon>
                            <FaTrashCan />
                        </ListItemIcon>
                        <Box>
                            <ListItemText primary="Корзина Stations" />
                        </Box>
                    </ListItemButton>

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
                </List>
            </Collapse>
        </List>
    );
};

export default CustomMenu;
