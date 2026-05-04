import { SetMetadata } from '@nestjs/common';

export const SERVICE_KEY_GUARD = 'serviceKey';
export const ServiceKey = () => SetMetadata(SERVICE_KEY_GUARD, true);
