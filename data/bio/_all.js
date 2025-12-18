export const ALL_QUESTION_IDS = [
  'e942324a-649a-4cdc-9ad3-631b6784e641',
  'a67bbc2b-7268-4829-8cda-065e16d44871',
  'e855a3d4-bc3a-40fe-87c9-c9dfd6d3e584',
  '8ef4acef-63df-4354-a416-03e82f4516b3',
  '17d35a80-e2dc-4808-8c52-d06b416fb6ee',
  'c757b321-d8eb-4ee0-b61c-f6bd82899004',
  '0e9c692e-58b4-4d2d-bdd5-324e8876ed44',
  'dec5bb5c-1e49-4606-a2d4-41decdf76515',
  '2ac13901-c41f-453f-baa7-33e87459497d',
  'b08297fe-5f9e-4a04-a527-8359330c194b',
  'fd72cf42-e2cc-4000-89a6-b3d5ae2eee7c',
  '86d77309-5819-40d4-802b-fd7f83f5e4ae',
  '2d34bbe3-a9e4-4639-b600-20752b513f98',
  'ca3bafc0-9b05-41d5-b880-7e119d530ebc',
  '9c36e2bf-ba00-4e07-9be7-a19fb5103ffd',
  'a9894f47-b5cd-4c5e-9534-3770dab1e27d',
  '2792137f-2319-453a-8293-136acfecf6e0',
  '60ba72b5-e5e4-4ce0-b06e-3ef59cf15260',
  '44f4c258-c156-4059-9705-ad44b297011d',
  'a18a2676-8efc-4900-9c0c-14ca111ad6e4',
  '70a20167-fb3e-431b-b08a-b9a9ef69e32e',
  '23602846-6484-4af2-84ca-c0f014538830',
  'ad3be889-b7a1-4d9e-83ad-6bab0e2e6dcb',
  '30f0594d-32df-48da-8dd9-472bb162759c',
  'dbae382c-ed71-428a-82a4-2070e21d3835',
  'bd7301b4-7417-4ef5-8bac-f3d21817323e',
  'b2b5ea68-c1da-4a5f-b308-68731ac43803',
  '3d35229d-9f30-486c-8971-cb84500b8f8e',
  '39118820-d5e4-4ad7-8523-96c3160c457d',
  'd614492f-c656-4d78-94ef-885062a80fc1',
  '4f191189-5a94-4586-8ce7-118b286d92b0',
  '5ed6340f-d766-4937-a5ff-ddfa2f2e1974',
  'd9c3a8ca-9803-4c31-82e8-c622f809164c',
  'd294a6af-ee22-47a2-9356-7b1daa5d5d97',
  'e6055d8b-6383-4106-b765-0a0ca0875b2f',
  '2c0ee6ff-d3fd-4be0-a2a3-8597dffb6c48',
  'eac604ae-c8bd-4634-82c7-37c23116c58a',
  '68764b0a-9d80-4a0a-9b82-15611e1a0f28',
  'c9230844-de29-4a22-9630-8af0ecd7ff6a',
  'edab9134-2e5c-4ab5-96ba-532ef1706101',
  '6b0356cb-7179-4ad8-8a91-bca99924b1e0',
  '6014528a-47e2-49a6-975c-a8f7d126ea61',
  'e52e8a26-79cf-4658-8e6e-602ee23dc086',
  'd3864717-50d7-4254-85c0-ab04ed3c4e81',
  '594baa0e-ddeb-4fc0-bc9c-46220a847f15',
  '1bd155a2-512e-4ed5-bdeb-54526fdc1cb1',
  'e0a0a088-a28b-46ab-875e-9b471a5cb7a0',
  '4aa3f7a2-d7a5-41aa-879f-6709c56a389d',
  'cc32e855-1bb6-4401-b66b-399a7b41fa32',
  '47ca1321-d958-48a0-ac38-c5c4e11e85b2',
  '8ecb8e4c-449d-47ef-a6e4-408ca51b3786',
  '8445dbfb-9e2a-4298-b3ad-46ec44c1f7ac',
  '746de03c-dd2c-476c-a356-bd1973b565be',
  '37c9bbbd-2f5c-4611-96e0-951a66a0650d',
  'c44c502f-daf4-44cf-8b2c-29ae2276f96c',
  'e3ef1139-0c42-409c-bd19-039a0121cba7',
  'cc18e16b-d221-4efe-bfad-cc6811703568',
  'e56285d6-d1a3-47c4-8ca5-3882971ba088',
  '04732bdb-15d7-40a2-9630-04b7826ad87e',
  '8c2c057e-e524-44a1-960d-6e7c3b803f88',
];

function sampleWithoutReplacement(items, count) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

export async function getAllQuestionIds() {
  return ALL_QUESTION_IDS.slice();
}

export async function getRandomQuestionIds(count) {
  const safeCount = Math.max(0, Math.min(Number(count) || 0, ALL_QUESTION_IDS.length));
  return sampleWithoutReplacement(ALL_QUESTION_IDS, safeCount);
}
