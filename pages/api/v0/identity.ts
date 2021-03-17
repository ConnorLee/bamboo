import type { NextApiRequest, NextApiResponse } from "next";
import { getPDMSessionToken, _signAsPDM } from "../../../src/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const operandDID = req.body.operandDID;
  if (!operandDID)
    res
      .status(400)
      .end("Must provide operandDID in request to /api/v0/identity");
  try {
    const jws = await _signAsPDM(
      operandDID,
      process.env.PDM_SEED!,
      process.env.NEXT_PUBLIC_CERAMIC_URL!
    );
    const token = await getPDMSessionToken(jws);
    res.status(201).end(token);
  } catch (err) {
    res.status(500).end(err.message);
  }
}
