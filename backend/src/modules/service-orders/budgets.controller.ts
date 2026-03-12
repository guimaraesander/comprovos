import { Request, Response, NextFunction } from "express";
import { getRequiredParam } from "../../utils/get-required-param";
import { upsertBudgetSchema } from "./budgets.schemas";
import { BudgetsService } from "./budgets.service";

export class BudgetsController {
  private budgets = new BudgetsService();

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getRequiredParam(req.params, "id");
      const budget = await this.budgets.getByServiceOrderId(id);
      return res.status(200).json(budget);
    } catch (err) {
      return next(err);
    }
  }

  async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getRequiredParam(req.params, "id");
      const input = upsertBudgetSchema.parse(req.body);
      const saved = await this.budgets.upsert(id, input);
      return res.status(200).json(saved);
    } catch (err) {
      return next(err);
    }
  }
}