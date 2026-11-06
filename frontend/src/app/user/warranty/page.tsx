import { redirect } from 'next/navigation';

export default function UserWarrantyRedirect() {
    redirect('/user/faq?action=warranty');
}
