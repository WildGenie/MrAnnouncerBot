﻿using System;
using System.Collections.Generic;
using System.Linq;

namespace DndCore
{
	public abstract class Effect
	{
		public int timeOffsetMs = 0;
		public EffectKind effectKind;

		public Effect()
		{

		}
	}
}
