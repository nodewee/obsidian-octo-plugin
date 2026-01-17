import { FolderFilter } from '../src/core/FolderFilter';

interface TestCase {
	name: string;
	patterns: string[];
	folders: string[];
	expectedIgnored: string[];
	expectedAllowed: string[];
}

const testCases: TestCase[] = [
	{
		name: 'Exact match',
		patterns: ['archive'],
		folders: ['archive', 'templates', 'notes'],
		expectedIgnored: ['archive'],
		expectedAllowed: ['templates', 'notes']
	},
	{
		name: 'Subfolder match',
		patterns: ['archive'],
		folders: ['archive', 'archive/old', 'archive/2024', 'templates'],
		expectedIgnored: ['archive', 'archive/old', 'archive/2024'],
		expectedAllowed: ['templates']
	},
	{
		name: 'Wildcard * in single segment',
		patterns: ['*/attachments'],
		folders: ['project1/attachments', 'project2/attachments', 'attachments', 'project1/notes'],
		expectedIgnored: ['project1/attachments', 'project2/attachments'],
		expectedAllowed: ['attachments', 'project1/notes']
	},
	{
		name: 'Wildcard * in folder name',
		patterns: ['temp*'],
		folders: ['temp', 'temp123', 'temporary', 'templates'],
		expectedIgnored: ['temp', 'temp123', 'temporary', 'templates'],
		expectedAllowed: []
	},
	{
		name: 'Double wildcard **',
		patterns: ['**/temp'],
		folders: ['temp', 'project1/temp', 'project1/sub/temp', 'templates'],
		expectedIgnored: ['temp', 'project1/temp', 'project1/sub/temp'],
		expectedAllowed: ['templates']
	},
	{
		name: 'Mixed patterns',
		patterns: ['archive', '*/attachments', '**/temp'],
		folders: ['archive', 'archive/old', 'project1/attachments', 'project1/temp', 'project1/sub/temp', 'notes'],
		expectedIgnored: ['archive', 'archive/old', 'project1/attachments', 'project1/temp', 'project1/sub/temp'],
		expectedAllowed: ['notes']
	},
	{
		name: 'Case insensitive - exact match',
		patterns: ['Archive'],
		folders: ['archive', 'Archive', 'ARCHIVE', 'notes'],
		expectedIgnored: ['archive', 'Archive', 'ARCHIVE'],
		expectedAllowed: ['notes']
	},
	{
		name: 'Case insensitive - wildcard * in path',
		patterns: ['*/ATTACHMENTS'],
		folders: ['project1/attachments', 'PROJECT1/ATTACHMENTS', 'Project1/Attachments', 'attachments'],
		expectedIgnored: ['project1/attachments', 'PROJECT1/ATTACHMENTS', 'Project1/Attachments'],
		expectedAllowed: ['attachments']
	},
	{
		name: 'Case insensitive - wildcard * in name',
		patterns: ['TEMP*'],
		folders: ['temp', 'TEMP', 'Temp', 'temp123', 'TEMP123', 'Temp123', 'templates'],
		expectedIgnored: ['temp', 'TEMP', 'Temp', 'temp123', 'TEMP123', 'Temp123', 'templates'],
		expectedAllowed: []
	},
	{
		name: 'Case insensitive - double wildcard **',
		patterns: ['**/TEMP'],
		folders: ['temp', 'TEMP', 'Temp', 'project1/temp', 'PROJECT1/TEMP', 'Project1/Temp'],
		expectedIgnored: ['temp', 'TEMP', 'Temp', 'project1/temp', 'PROJECT1/TEMP', 'Project1/Temp'],
		expectedAllowed: []
	},
	{
		name: 'Case insensitive - mixed patterns',
		patterns: ['Archive', '*/ATTACHMENTS', '**/TEMP'],
		folders: ['archive', 'ARCHIVE', 'project1/attachments', 'PROJECT1/ATTACHMENTS', 'temp', 'TEMP', 'notes'],
		expectedIgnored: ['archive', 'ARCHIVE', 'project1/attachments', 'PROJECT1/ATTACHMENTS', 'temp', 'TEMP'],
		expectedAllowed: ['notes']
	},
	{
		name: 'Case insensitive - subfolder match',
		patterns: ['Archive'],
		folders: ['archive', 'Archive/OLD', 'ARCHIVE/2024', 'templates'],
		expectedIgnored: ['archive', 'Archive/OLD', 'ARCHIVE/2024'],
		expectedAllowed: ['templates']
	},
	{
		name: 'Case insensitive - complex wildcard',
		patterns: ['*Temp*'],
		folders: ['temp', 'Temp', 'TEMP', 'mytemp', 'MyTemp', 'MYTEMP', 'temporary', 'Temporary', 'TEMPORARY'],
		expectedIgnored: ['temp', 'Temp', 'TEMP', 'mytemp', 'MyTemp', 'MYTEMP', 'temporary', 'Temporary', 'TEMPORARY'],
		expectedAllowed: []
	},
	{
		name: 'Empty patterns',
		patterns: [],
		folders: ['archive', 'templates', 'notes'],
		expectedIgnored: [],
		expectedAllowed: ['archive', 'templates', 'notes']
	},
	{
		name: 'Empty folders list',
		patterns: ['archive'],
		folders: [],
		expectedIgnored: [],
		expectedAllowed: []
	},
	{
		name: 'Pattern with special characters',
		patterns: ['.config'],
		folders: ['.config', '.config/plugins', 'notes'],
		expectedIgnored: ['.config', '.config/plugins'],
		expectedAllowed: ['notes']
	},
	{
		name: 'Multiple * in pattern',
		patterns: ['*test*'],
		folders: ['test', 'mytest', 'test123', 'mytest123', 'notes'],
		expectedIgnored: ['test', 'mytest', 'test123', 'mytest123'],
		expectedAllowed: ['notes']
	},
	{
		name: '** at start',
		patterns: ['**/old'],
		folders: ['old', 'archive/old', 'archive/sub/old', 'notes'],
		expectedIgnored: ['old', 'archive/old', 'archive/sub/old'],
		expectedAllowed: ['notes']
	},
	{
		name: '** in middle',
		patterns: ['archive/**/old'],
		folders: ['archive/old', 'archive/sub/old', 'archive/sub/deep/old', 'notes'],
		expectedIgnored: ['archive/old', 'archive/sub/old', 'archive/sub/deep/old'],
		expectedAllowed: ['notes']
	},
	{
		name: 'Exact match with trailing slash',
		patterns: ['archive/'],
		folders: ['archive', 'archive/old', 'notes'],
		expectedIgnored: ['archive', 'archive/old'],
		expectedAllowed: ['notes']
	}
];

let passed = 0;
let failed = 0;

console.log('Running FolderFilter tests...\n');

for (const testCase of testCases) {
	const filter = new FolderFilter(testCase.patterns);
	const result = filter.filterFolders(testCase.folders);

	const ignoredMatch = 
		result.ignored.length === testCase.expectedIgnored.length &&
		result.ignored.every(f => testCase.expectedIgnored.includes(f));
	
	const allowedMatch = 
		result.folders.length === testCase.expectedAllowed.length &&
		result.folders.every(f => testCase.expectedAllowed.includes(f));

	if (ignoredMatch && allowedMatch) {
		console.log(`✓ ${testCase.name}`);
		passed++;
	} else {
		console.log(`✗ ${testCase.name}`);
		if (!ignoredMatch) {
			console.log(`  Expected ignored: [${testCase.expectedIgnored.join(', ')}]`);
			console.log(`  Got ignored:      [${result.ignored.join(', ')}]`);
		}
		if (!allowedMatch) {
			console.log(`  Expected allowed: [${testCase.expectedAllowed.join(', ')}]`);
			console.log(`  Got allowed:      [${result.folders.join(', ')}]`);
		}
		failed++;
	}
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exit(1);
}