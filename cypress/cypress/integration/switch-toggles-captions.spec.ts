/*
This software is Copyright ©️ 2020 The University of Southern California. All Rights Reserved. 
Permission to use, copy, modify, and distribute this software and its documentation for educational, research and non-profit purposes, without fee, and without a written agreement is hereby granted, provided that the above copyright notice and subject to the full license file found in the root of this software deliverable. Permission to make commercial use of this software may be obtained by contacting:  USC Stevens Center for Innovation University of Southern California 1150 S. Olive Street, Suite 2300, Los Angeles, CA 90115, USA Email: accounting@stevens.usc.edu
The full terms of this copyright and license should always be found in the root directory of this software deliverable as "license.txt" and if these terms are not found with this software, please contact the USC Stevens Center for the full license.
*/
import { mockDefaultSetup } from '../support/helpers';

describe('Plays a video in response to a user question', () => {
  it('plays a mentor response and displays subtitles', () => {
    mockDefaultSetup(cy);
    cy.viewport('iphone-x');
    cy.visit('/?mentor=clint');
    cy.get('[data-cy=input-field]').type('is the food good');
    cy.get('[data-cy=input-send]').trigger('mouseover').click();
    cy.get('[data-cy=video-container]').should(
      'have.attr',
      'data-video-type',
      'answer'
    );
    cy.get('[data-cy=video-container] video').should('exist');
    cy.get('[data-cy=video-container] video')
      .should('have.attr', 'src')
      .and('match', /.*answer_id.mp4$/);
    cy.get('[data-cy=caption-switch]').should('exist');
    cy.get('[data-cy=caption-switch]').find('input').should('be.checked');
  });
});
