package MyBot;
use strict;
use warnings;
use parent 'Ants';

# This is where the implementation of your bot goes!

# setup() will be called once, after the game parameters come in, but before
# the game starts up.
sub setup {
    my $self = shift;
}

# create_orders() will be run after parsing the incoming map data, every turn.
sub create_orders {
    my $self = shift;

    for my $ant ($self->my_ants) {
        my ($antx, $anty) = @$ant;
        my @food = $self->nearby_food($ant);
        my $direction;

        if (@food) {
            my ($foodx, $foody) = @{$food[0]};
            $direction = $self->direction(
                $antx, $anty,
                $foodx, $foody
            );
        }
        else {
            if ($self->passable($antx+1, $anty)) {
                $direction = 'E'
            }
            elsif ($self->passable($antx, $anty+1)) {
                $direction = 'N'
            }
            elsif ($self->passable($antx-1, $anty)) {
                $direction = 'W'
            }
            elsif ($self->passable($antx, $anty-1)) {
                $direction = 'S'
            }
        }

        $self->issue_order(
            $antx, $anty, $direction
        );
    }
}

# This demonstrates the use of some of the methods available in the Ants
# library.
# This subroutine returns a list of nearby food for a given location, sorted
# by distance.
sub nearby_food {
    my ($self, $ant_location) = @_;

    # We will ignore food further away than this distance:
    my $goal_distance = ($self->width + $self->height) / 4;

    my @foods;

    for my $food ($self->food) {
        if (
            (my $dist = $self->distance(
                $ant_location->[0], $ant_location->[1],
                $food->[0], $food->[1]
            )) < $goal_distance
        ) {
            push @foods, { distance => $dist, tile => $food };
        }
    }
    return map { $_->{tile} } sort {
        $a->{distance} <=> $b->{distance}
    } @foods;
}

1;
