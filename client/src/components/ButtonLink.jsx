import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';

export default function ButtonLink({ to, children, className = '', ...props }) {
  const navigate = useNavigate();
  return <Button className={className} onPress={() => navigate(to)} {...props}>{children}</Button>;
}