'use strict';

var SkillData = function() {
  EventEmitter.call(this);
  this.skills = [];
};

SkillData.prototype = Object.create(EventEmitter.prototype);

SkillData.prototype.useSkill = function(skill) {
  var skillData = GDM.getNow('skill_data');
  var data = skillData.getData(skill.skillIdx);
  var type = parseInt(data[SKILL.TYPE]);

  switch(type) {
  case SKILL_ACTION_TYPE.BASE_ACTION:
    var command = parseInt(data[SKILL.BASIC_COMMAND]);
    this._useCommand(command);
    break;
  case SKILL_ACTION_TYPE.EMOTION_ACTION:
    var motion = parseInt(data[SKILL.ANI_ACTION_TYPE]);
    netGame.setMotion(motion, 1);
    break;
  case SKILL_ACTION_TYPE.ACTION_IMMEDIATE:
    var target = MC.target.object;
    if (target) {
      netGame.useSkillOnTarget(skill.slot, target.serverObjectIdx);
    }
    break;
  default:
    console.warn('TODO: Unimplemented useSkill', skill);
    break;
  }
};

SkillData.prototype._useCommand = function(command) {
  var target = MC.target;
  switch (command) {
  case BASIC_COMMAND.PARTY:
    if (target) {
      if (MC.party.exists) {
        if (MC.party.leaderTag === MC.uniqueTag) {
          netGame.partyRequest(PARTY_REQ_JOIN, target.serverObjectIdx);
        } else {
          GCM.system('Only the party leader can send party invites.');
        }
      } else {
        netGame.partyRequest(PARTY_REQ_MAKE, target.serverObjectIdx);
      }
    }
    break;
  }
};

SkillData.prototype.setSkills = function(skills) {
  this.skills = skills;
  this.emit('changed');
};

SkillData.prototype.appendSkills = function(skills) {
  this.skills = this.skills.concat(skills);
  this.emit('changed');
};

SkillData.prototype.findBySlot = function(slotNo) {
  for (var i = 0; i < this.skills.length; ++i) {
    if (this.skills[i].slot === slotNo) {
      return this.skills[i];
    }
  }

  return null;
};