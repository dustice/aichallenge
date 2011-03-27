using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Bot
{
    class SimpleBot : Ants
    {
        public override void  DoLogic()
        {
            Random rand = new Random();
            foreach (Tile tile in MyAnts)
            {
                int rnd = rand.Next(4);
                Aim dir;
                if (rnd == 0) dir = Aim.NORTH;
                else if (rnd == 1) dir = Aim.EAST;
                else if (rnd == 2) dir = Aim.SOUTH;
                else dir = Aim.WEST;

                issueOrder(tile, (Aim)dir);
            }
 	         base.DoLogic();
        }

        public static void Main()
        {
            SimpleBot Bot = new SimpleBot();
            Bot.Run();
        }
    }
}
