const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function runTest() {
  try {
    console.log('1. Uploading CSV to /api/import/preview...');
    const form = new FormData();
    form.append('file', fs.createReadStream('../expenses export.csv'));

    const previewRes = await axios.post('http://localhost:3001/api/import/preview', form, {
      headers: form.getHeaders()
    });
    
    const expenses = previewRes.data.expenses;
    console.log(`Preview returned ${expenses.length} expenses.`);
    
    console.log('\n2. Sending parsed expenses to /api/import/confirm to save to DB...');
    const confirmRes = await axios.post('http://localhost:3001/api/import/confirm', { expenses });
    console.log(`Confirm response:`, confirmRes.data);

    console.log('\n3. Fetching groups to find the created group ID...');
    const groupsRes = await axios.get('http://localhost:3001/api/groups');
    const groups = groupsRes.data;
    if (groups.length === 0) {
      throw new Error("No groups found!");
    }
    const groupId = groups[0].id;
    console.log(`Found group ID: ${groupId} (${groups[0].name})`);

    console.log('\n4. Fetching balances and settlement computations for group...');
    const balanceRes = await axios.get(`http://localhost:3001/api/groups/${groupId}/balances`);
    
    console.log('\n--- Final Balance Computation Results ---');
    console.log(`Total Expenses: ${balanceRes.data.totalExpenses} INR`);
    console.log(`Members: ${balanceRes.data.members.join(', ')}`);
    
    console.log('\nIndividual Net Balances:');
    balanceRes.data.userBalances.forEach(b => {
      console.log(`  ${b.userName}: ${b.balance >= 0 ? '+' : ''}${b.balance} INR`);
    });
    
    console.log('\nSuggested Minimum Settlements:');
    if (balanceRes.data.balances.length === 0) console.log('  All settled up!');
    balanceRes.data.balances.forEach(s => {
      console.log(`  ${s.from} pays ${s.to} ${s.amount} INR`);
    });

  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
  }
}

runTest();
