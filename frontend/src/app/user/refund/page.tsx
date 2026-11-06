import { redirect } from 'next/navigation';

export default function UserRefundRedirect() {
    redirect('/user/faq?action=refund');
}
