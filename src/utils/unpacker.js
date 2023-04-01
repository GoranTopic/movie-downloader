const unpackFinancialStaments = financialStatments => ({
    balanceSheet: financialStatments["balanceSheetHistory"].balanceSheetStatements[0],
    balanceSheetQuarterly: financialStatments["balanceSheetHistoryQuarterly"].balanceSheetStatements[0],
    cashFlow: financialStatments["cashflowStatementHistory"].cashflowStatements[0],
    cashFlowQuartery: financialStatments["cashflowStatementHistoryQuarterly"].cashflowStatements[0],
    incomeStatment: financialStatments["incomeStatementHistory"].incomeStatementHistory[0],
    incomeStatmentQuartery: financialStatments["incomeStatementHistoryQuarterly"].incomeStatementHistory[0],
})

export  { unpackFinancialStaments }
