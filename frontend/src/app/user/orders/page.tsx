import { redirect } from 'next/navigation';

export default function UserOrdersRedirect() {
    redirect('/user/tickets');
}
