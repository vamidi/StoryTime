// Copyright Epic Games, Inc. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Framework/Commands/Commands.h"
#include "StoryTimeStyle.h"

class FStoryTimeCommands : public TCommands<FStoryTimeCommands>
{
public:

	FStoryTimeCommands()
		: TCommands<FStoryTimeCommands>(TEXT("StoryTime"), NSLOCTEXT("Contexts", "StoryTime", "StoryTime Plugin"), NAME_None, FStoryTimeStyle::GetStyleSetName())
	{
	}

	// TCommands<> interface
	virtual void RegisterCommands() override;

public:
	TSharedPtr< FUICommandInfo > PluginAction;
};
