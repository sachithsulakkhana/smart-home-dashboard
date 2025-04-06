// src/components/common/PageHeader.js
import React from 'react';
import { 
  Typography, 
  Box, 
  Breadcrumbs, 
  Link, 
  Button, 
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * Reusable page header component with title, breadcrumbs, and optional action button
 * 
 * @param {Object} props Component props
 * @param {string} props.title Page title
 * @param {Array} props.breadcrumbs Array of breadcrumb items (optional)
 * @param {Object} props.actionButton Configuration for the action button (optional)
 * @param {string} props.subtitle Optional subtitle text
 * @param {React.ReactNode} props.icon Optional icon to display next to the title
 * @param {Object} props.sx Additional styles
 */
const PageHeader = ({ 
  title, 
  breadcrumbs, 
  actionButton, 
  subtitle, 
  icon,
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box 
      sx={{ 
        mb: 4, 
        ...sx 
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography key={index} color="text.primary">
                {crumb.text}
              </Typography>
            ) : (
              <Link 
                key={index} 
                color="inherit" 
                href={crumb.href} 
                onClick={crumb.onClick}
                underline="hover"
              >
                {crumb.text}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && (
            <Box 
              sx={{ 
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                mr: 1
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="subtitle1" color="text.secondary" mt={0.5}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        
        {actionButton && (
          <Button
            variant={actionButton.variant || "contained"}
            color={actionButton.color || "primary"}
            startIcon={actionButton.icon}
            onClick={actionButton.onClick}
            size={actionButton.size || "medium"}
            disabled={actionButton.disabled}
          >
            {actionButton.text}
          </Button>
        )}
      </Box>
      
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
};

export default PageHeader;