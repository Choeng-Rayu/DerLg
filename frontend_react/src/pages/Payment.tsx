import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { CreditCard, ArrowLeft, Check, Loader2 } from 'lucide-react';

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const location = useLocation();
  const totalPrice = (location.state as { totalPrice?: number })?.totalPrice || 120;

  const [paymentMethod, setPaymentMethod] = React.useState<'card' | 'qr'>('card');
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiry, setExpiry] = React.useState('');
  const [cvc, setCvc] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePayment = () => {
    if (paymentMethod === 'card' && (!cardNumber || !expiry || !cvc)) {
      toast.error('Please fill in all card details');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Payment successful!');
      navigate('/confirmation', { state: { bookingId: bookingId || 'mock-id', totalPrice } });
    }, 2000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Payment</h1>

      <div className="flex gap-3">
        <button
          onClick={() => setPaymentMethod('card')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 text-center font-medium transition-colors ${
            paymentMethod === 'card'
              ? 'border-derlg-primary bg-derlg-primary/5 text-derlg-primary'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <CreditCard className="h-5 w-5 mx-auto mb-1" />
          Card
        </button>
        <button
          onClick={() => setPaymentMethod('qr')}
          className={`flex-1 py-3 px-4 rounded-lg border-2 text-center font-medium transition-colors ${
            paymentMethod === 'qr'
              ? 'border-derlg-primary bg-derlg-primary/5 text-derlg-primary'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <div className="h-5 w-5 mx-auto mb-1 border-2 border-current rounded" />
          QR Code
        </button>
      </div>

      <Card className="p-6">
        {paymentMethod === 'card' ? (
          <div className="space-y-4">
            <Input
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Expiry Date"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
              <Input
                label="CVC"
                placeholder="123"
                type="password"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="text-gray-400 text-sm">QR Code Placeholder</div>
            </div>
            <p className="text-sm text-gray-600">Scan with your banking app</p>
          </div>
        )}

        <div className="border-t border-gray-100 mt-6 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-xl font-bold text-derlg-primary">${totalPrice.toFixed(2)}</span>
          </div>
          <Button onClick={handlePayment} className="w-full" size="lg" loading={isProcessing} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Pay Now
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Payment;
