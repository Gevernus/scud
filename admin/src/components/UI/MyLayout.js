import { Layout, Sidebar, useSidebarState } from 'react-admin';
import CustomMenu from './CustomMenu';
import { styled } from '@mui/material/styles';

// Dynamically changing the width of the sidebar
const CustomSidebar = styled(Sidebar)(({ theme }) => {
    const [open] = useSidebarState(); // Monitoring the condition of the sidebar
    return {
        width: open ? 290 : 50, 
        transition: 'width 0.3s ease-in-out',
        '& .MuiDrawer-paper': {
            width: open ? 290 : 50,
            transition: 'width 0.3s ease-in-out',
            overflowX: 'hidden', 
        },
    };
});

const MyLayout = (props) => {
    const [open] = useSidebarState(); 
    return <Layout {...props} menu={() => <CustomMenu open={open} />} sidebar={CustomSidebar} />;
};

export default MyLayout;
