import { headers } from 'next/headers';
import { decodeTenant, TENANT_HEADER, type Tenant } from './resolve';

/** A escola do endereço atual (definida pelo middleware), ou null no Nexa geral. */
export async function getTenant(): Promise<Tenant | null> {
  return decodeTenant((await headers()).get(TENANT_HEADER));
}
