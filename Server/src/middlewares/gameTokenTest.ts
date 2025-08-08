import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import config from "../config/config";
import { AppDataSource } from "../config/database";
import { Game, GameStatus } from "../entities/Games";
import { ApiError } from "./errorHandler";

const WORKER_JWT_SECRET = config.r2.workerJwtSecret;

const gameRepository = AppDataSource.getRepository(Game);

const gameTokenTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { gameId } = req.params;

    // Get the game with its file information
    const game = await gameRepository.findOne({
      where: { id: gameId, status: GameStatus.ACTIVE },
      relations: ["gameFile", "thumbnailFile"],
    });

    if (!game) {
      return next(
        ApiError.notFound(`Game with id ${gameId} not found or not active`)
      );
    }

    if (!game.gameFile) {
      return next(ApiError.badRequest("Game file not found"));
    }

    // Use provided userId or fall back to authenticated user
    // const targetUserId = userId || req.user?.userId;

    // if (!targetUserId) {
    //   return next(ApiError.badRequest("User ID is required"));
    // }

    // Calculate expiration time
    let expirationSeconds: number = 60 * 60;
    // const timeUnit = expiresIn.slice(-1);
    // const timeValue = parseInt(expiresIn.slice(0, -1));

    // switch (timeUnit) {
    //   case "s":
    //     expirationSeconds = timeValue;
    //     break;
    //   case "m":
    //     expirationSeconds = timeValue * 60;
    //     break;
    //   case "h":
    //     expirationSeconds = timeValue * 60 * 60;
    //     break;
    //   case "d":
    //     expirationSeconds = timeValue * 24 * 60 * 60;
    //     break;
    //   default:
    //     expirationSeconds = 60 * 60; // Default to 1 hour
    // }

    // Create JWT payload for the worker
    const payload = {
      // userId: targetUserId,
      gameId: game.id,
      gameTitle: game.title,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expirationSeconds,
    };

    // Generate JWT token using the worker secret
    const token = jwt.sign(payload, WORKER_JWT_SECRET);

    // Get the game file URL through the worker
    const workerUrl = config.r2.publicUrl;
    const gameFileKey = game.gameFile.s3Key;
    const gameUrl = `${workerUrl}/${gameFileKey}`;

    const expiresAt = new Date((payload.iat + expirationSeconds) * 1000);

    res.cookie("game-auth-token", token, {
      domain: new URL(workerUrl).hostname,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: expiresAt,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        gameUrl,
        gameFileKey,
        cookieInstructions: {
          name: "game-auth-token",
          value: token,
          domain: new URL(workerUrl).hostname,
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "None",
          expires: expiresAt.toISOString(),
        },
        testInstructions: {
          message: "To test access, set the cookie and visit the gameUrl",
          curlExample: `curl -H "Cookie: game-auth-token=${token}" "${gameUrl}"`,
          browserTest: `document.cookie = "game-auth-token=${token}; domain=${
            new URL(workerUrl).hostname
          }; path=/; secure; samesite=none"; window.open("${gameUrl}");`,
        },
      },
    });
  } catch (error) {
    logger.error("Error generating game access token:", error);
    next(error);
  }
};

export default gameTokenTest;
