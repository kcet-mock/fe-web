export const ALL_QUESTION_IDS = [
  'e6f7f438-a025-4c39-b1e7-22de835ec8ff',
  '0144f934-0818-46c9-8499-7f006de5f62e',
  '0945d3a5-b71b-4ea5-9829-27bf2ef127a9',
  '17e52268-032e-439c-835f-2d42a1a9f498',
  'c6b69001-aa8c-47bd-860e-5068a5656867',
  '7bd2ff4b-b7a2-4f79-823d-add6bb1debfc',
  'e13652f6-70f7-4bf9-bfbf-0651a8fa499f',
  '32ddc7f6-a479-4581-b783-c428c844fd79',
  '3dd7e615-8982-4e63-b7cd-523274b13de9',
  'a57c77ca-8d79-433a-a0e3-270e6b6d3e36',
  '956c61c2-6d9e-40f5-8674-98e869753e4b',
  'b7490d15-512a-47b1-b3bb-327933978d7e',
  'd3a67d4d-f48c-4c38-8213-ead457f58297',
  '6167d148-6040-4e05-a7d9-583267559b07',
  '4b03013f-98da-4bf6-a57b-fc9b106c64b2',
  'f44bef54-d09e-4a1b-9f8c-f18b6e051698',
  '56158c8d-ff09-427c-b624-39a8c5a2ac38',
  '1ee89cd5-5796-454b-bc88-e5dba09554f8',
  'e390b16e-b358-4fb4-8c10-abc8e3004bb5',
  'b0458327-eb06-4bf3-b2e5-489f9f8681f3',
  'b9099f1a-06cf-42da-bbd2-bb044d68b8a8',
  'a1f09af1-e807-495f-8135-333a22868cd8',
  '2cc76c22-19d0-45c0-bba4-b5054ccad6ff',
  'de190931-9003-4acf-9421-e95030c1faee',
  '149fc113-e439-49a6-a95d-dfd8ac0b5a45',
  '7f68d9e8-5a8a-43b4-a581-44e0c84ddff8',
  '7fce5d8c-01ea-4441-b399-c0548fc1ba8c',
  'd40c6544-5530-455d-af7c-abd3e87e7437',
  '01e1d7bc-bc82-4877-9d6a-df47b2a8e44f',
  '2c98c7be-147e-454f-88e7-98eb7820c340',
  '68771ab5-3f48-4f88-b370-fb6d7845f252',
  'c12612ba-855e-45e8-a172-c0aba683bfcb',
  '41efbdbe-04cd-44d6-8eaf-a338694c531f',
  'e7f328cf-94d9-468d-8daa-6d46d99b11fe',
  '9e98fade-bbe4-47bd-acce-d18f9820b608',
  'ff6d9886-f1b3-4b53-8e6f-e4b478d89905',
  '279d9472-ab78-47d1-8503-48e5ca86ccbb',
  '69e804db-6527-4bad-957f-dc2bd7441141',
  'fff9d0c0-d20b-4301-98fa-3d1893158b0f',
  '694b172f-c7be-45f7-803c-12326b1612ae',
  'c0f030b6-0060-44a3-b8d9-5665a1eefa2e',
  'a21ef69e-2316-45e9-973b-3877b8a41553',
  '8453e895-538e-47c5-a4fb-a87c1ab721e4',
  'd7979725-4974-47a1-b4c9-56857f138895',
  '28dfcc9e-1559-4ffb-be19-8ea7453df495',
  '9203b778-fa36-43fa-90c4-dfd26d667386',
  'ddfbfefe-8f1e-4c03-aa57-8b172a3989b8',
  '1ae37328-c265-4e93-8d51-846f753a6d66',
  '84da9b68-d6db-4e30-97c4-afe0ed3ddc0c',
  'b8b839a9-fb19-4355-ac0d-e5502f7690b6',
  '8d9dc827-25e6-4142-a635-61a27cb08584',
  '7ee61f5d-eb49-44c5-bc0d-33a28783e4b7',
  '091c91c4-f2b8-4c2b-8855-84fcc7164b36',
  '1a11a632-e03a-4d8c-8109-6a4af90c5e75',
  'd7fca63c-a32a-47b7-b05e-a96aaf658a2a',
  '990746ff-9baf-4fa4-a455-454b6b393392',
  '296afb74-840f-4514-8924-2d9a17e412ba',
  '368a390d-adf5-4aa1-a08f-b96c223732c7',
  '216d2b16-6b8b-46bd-ada0-0be72a9f5d30',
  '2a4b541b-12fb-48bd-88e2-cde4fdb59442',
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
