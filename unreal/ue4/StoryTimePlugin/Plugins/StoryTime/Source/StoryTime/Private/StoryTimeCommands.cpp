// Copyright Epic Games, Inc. All Rights Reserved.

#include "StoryTimeCommands.h"

#define LOCTEXT_NAMESPACE "FStoryTimeModule"

void FStoryTimeCommands::RegisterCommands()
{
	UI_COMMAND(PluginAction, "StoryTime", "Execute StoryTime action", EUserInterfaceActionType::Button, FInputGesture());
}

#undef LOCTEXT_NAMESPACE
