import Link from 'next/link';
import { headers } from 'next/headers';
import { BudgetForm } from './_components/budget-form';
import { CurrencyForm } from './_components/currency-form';
import { ExpenseForm } from './_components/expense-form';
import { ExpenseRowList } from './_components/expense-row-list';
import { MonthNavigation, Pagination } from './_components/pagination';
import { Notice } from './_components/notice';
import {
  getCurrentMonthId,
  getDefaultExpenseDate,
  getMonthLabel,
  getTodayInputValue,
} from '@/lib/expense-data';
import { getLocale, getMonthParam, getPageNumber } from '@/lib/month-query';
import { currencyFromLocale, formatMoney } from '@/lib/money';
import { getMonthlyExpenseSummary, initializeLocalData } from '@/services/expense.service';

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const locale = getLocale(requestHeaders.get('accept-language'));
  const defaultCurrency = currencyFromLocale(requestHeaders.get('accept-language'));
  const month = getMonthParam(params.month, getCurrentMonthId());
  const pageNumber = getPageNumber(params.page);
  const notice = firstQueryValue(params.notice);
  const appSettings = await initializeLocalData(defaultCurrency);
  const summary = await getMonthlyExpenseSummary(month, pageNumber);
  const currency = appSettings.currency as typeof defaultCurrency;
  const monthLabel = getMonthLabel(month, locale);
  const budget = appSettings.monthlyBudgetMinor;
  const spent = summary.totalAmountMinor;
  const remaining = budget === null ? null : budget - spent;
  const budgetProgress = budget === null || budget <= 0 ? 0 : Math.min((spent / budget) * 100, 100);
  const overBudget = remaining !== null && remaining < 0;
  const exampleCount = summary.exampleCount;
  const currencyCanChange = summary.personalExpenseCount === 0;

  return (
    <main className="ledger-shell">
      <header className="topbar">
        <Link aria-label="Daily Ledger home" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            d
          </span>
          <span className="brand-name">daily ledger</span>
        </Link>
        <span className="local-badge">
          <span aria-hidden="true" className="local-indicator" />
          Stored on this device
        </span>
      </header>

      <section aria-labelledby="page-title" className="page-intro">
        <div>
          <p className="eyebrow">A LITTLE MORE CLARITY, EVERY DAY</p>
          <h1 id="page-title">Keep the little things in view.</h1>
          <p className="intro-copy">
            A simple place for everyday spending, so the month never has to be a mystery.
          </p>
        </div>
        <div className="month-control-wrap">
          <span className="month-caption">YOUR LEDGER</span>
          <MonthNavigation label={monthLabel} month={month} />
        </div>
      </section>

      <Notice notice={notice} />

      {exampleCount > 0 && (
        <aside className="example-note" aria-label="Example data notice">
          <span aria-hidden="true" className="example-note-mark">
            i
          </span>
          <p>
            A few clearly marked example expenses are here to show how your ledger works. Edit or
            remove them, then add your own.
          </p>
        </aside>
      )}

      <section aria-label={`${monthLabel} spending summary`} className="summary-band">
        <div className="summary-copy">
          <p className="eyebrow">THIS MONTH, SO FAR</p>
          <p className="summary-amount">{formatMoney(spent, currency, locale)}</p>
          <p className="summary-caption">
            across {summary.totalCount} {summary.totalCount === 1 ? 'expense' : 'expenses'}
          </p>
        </div>

        <div className="budget-pulse">
          <div className="pulse-heading">
            <div>
              <p className="eyebrow">MONTHLY LIMIT</p>
              {budget === null ? (
                <h2>Give the month a guardrail.</h2>
              ) : (
                <h2>{formatMoney(budget, currency, locale)}</h2>
              )}
            </div>
            {budget !== null && (
              <p className={`remaining-amount${overBudget ? 'is-over' : ''}`}>
                {formatMoney(Math.abs(remaining ?? 0), currency, locale)}
                <span>{overBudget ? ' over limit' : ' left'}</span>
              </p>
            )}
          </div>

          {budget !== null ? (
            <>
              <progress
                aria-label={`${Math.round(budgetProgress)} percent of monthly limit used`}
                className={`progress-track${overBudget ? 'progress-over' : ''}`}
                max={100}
                value={budgetProgress}
              />
              <div className="pulse-footnote">
                <span>
                  {overBudget
                    ? 'A little over — you can reset the plan anytime.'
                    : `${Math.round(budgetProgress)}% of your monthly limit used`}
                </span>
                <span>{formatMoney(budget, currency, locale)} limit</span>
              </div>
            </>
          ) : (
            <p className="pulse-empty-copy">
              Set one monthly amount and see how much room you have left.
            </p>
          )}

          <BudgetForm budgetMinor={budget} currency={currency} month={month} />
        </div>
      </section>

      <div className="workspace-grid">
        <section aria-labelledby="add-expense-title" className="entry-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MAKE A NOTE</p>
              <h2 id="add-expense-title">Add an expense</h2>
            </div>
            <span aria-hidden="true" className="section-mark">
              01
            </span>
          </div>
          <p className="section-description">
            Small details add up. Capture one while it is still fresh.
          </p>
          <ExpenseForm currency={currency} month={month} today={getDefaultExpenseDate(month)} />
          <CurrencyForm canChange={currencyCanChange} currency={currency} month={month} />
        </section>

        <section aria-labelledby="recent-expenses-title" className="activity-panel">
          <div className="section-heading activity-heading">
            <div>
              <p className="eyebrow">THE PAPER TRAIL</p>
              <h2 id="recent-expenses-title">Recent expenses</h2>
            </div>
            <span className="row-count">{summary.totalCount} total</span>
          </div>

          {summary.expenses.length > 0 ? (
            <>
              <ExpenseRowList
                currency={currency}
                expenses={summary.expenses}
                locale={locale}
                month={month}
                today={getTodayInputValue()}
              />
              <Pagination month={month} page={summary.page} pageCount={summary.pageCount} />
            </>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true" className="empty-ledger-mark">
                —
              </span>
              <h3>No expenses in {monthLabel.toLowerCase()} yet.</h3>
              <p>When you add your first one, it will be easy to find here.</p>
              <Link className="text-link" href="#add-expense-title">
                Add the first expense <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </section>
      </div>

      <footer className="page-footer">
        <span>Everyday spending, kept simple.</span>
        <span>Local by design · No account needed</span>
      </footer>
    </main>
  );
}
