import 'dotenv/config';
import { initializeLocalData } from '../services/expense.service';
import { currencyFromLocale } from '../lib/money';

async function main() {
  const currency = currencyFromLocale(process.env.LANG ?? null);
  await initializeLocalData(currency);
  console.log('Local example ledger initialized.');
}

main().catch((error: unknown) => {
  console.error('Could not initialize the local example ledger.', error);
  process.exitCode = 1;
});
