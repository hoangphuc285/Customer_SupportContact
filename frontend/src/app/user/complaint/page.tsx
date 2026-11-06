import { redirect } from 'next/navigation';

export default function UserComplaintRedirect() {
    redirect('/user/tickets');
}
