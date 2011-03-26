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
 	         base.DoLogic();
        }

        public static void Main()
        {
            SimpleBot Bot = new SimpleBot();
            Bot.Run();
        }
    }
}
