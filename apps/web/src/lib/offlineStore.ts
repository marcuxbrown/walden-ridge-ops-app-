import { get, set } from 'idb-keyval';

export type PendingAttachment = {
  name: string;
  type: string;
  dataUrl: string;
};

export type PendingIntake = {
  intakeId: string;
  payload: any;
  attachments: PendingAttachment[];
  createdAt: string;
};

const KEY = 'wr-pending-intakes';

export async function loadPendingIntakes(): Promise<PendingIntake[]> {
  return (await get(KEY)) ?? [];
}

export async function savePendingIntakes(intakes: PendingIntake[]) {
  await set(KEY, intakes);
}

export async function addPendingIntake(intake: PendingIntake) {
  const current = await loadPendingIntakes();
  current.push(intake);
  await savePendingIntakes(current);
}

export async function removePendingIntake(intakeId: string) {
  const current = await loadPendingIntakes();
  const next = current.filter((item) => item.intakeId !== intakeId);
  await savePendingIntakes(next);
}
