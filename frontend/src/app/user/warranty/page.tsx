import { redirect } from 'next/navigation';

export default function UserWarrantyRedirect() {
    redirect('/user/tickets');
}
